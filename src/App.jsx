import React, { useState, useCallback, useEffect } from 'react';

function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageQuality, setImageQuality] = useState(0.7);
  const [imageDimensions, setImageDimensions] = useState(800);

  const compressImage = useCallback((imgSrc, quality, maxWidth) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = imgSrc;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let newWidth = img.width;
        let newHeight = img.height;

        if (newWidth > maxWidth) {
          newHeight = Math.floor(newHeight * (maxWidth / newWidth));
          newWidth = maxWidth;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Get the compressed image data URL from the canvas
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = (e) => {
        reject(new Error("Failed to load image for compression."));
      };
    });
  }, []);

  useEffect(() => {
    const processImage = async () => {
      if (!originalFile) {
        setCompressedImage(null);
        setOriginalImageUrl(null);
        return;
      }

      setError(null);
      setLoading(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const url = e.target.result;
        setOriginalImageUrl(url);

        try {
          const compressedUrl = await compressImage(url, imageQuality, imageDimensions);
          setCompressedImage(compressedUrl);
        } catch (err) {
          setError(err.message || "Error during image compression.");
          setCompressedImage(null);
        } finally {
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError("Failed to read the file.");
        setLoading(false);
      };

      reader.readAsDataURL(originalFile);
    };

    processImage();
  }, [originalFile, imageQuality, imageDimensions, compressImage]);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];

    if (!file) {
      setError("Please select an image file.");
      setOriginalFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("The selected file is not an image. Please upload an image (e.g., JPEG, PNG).");
      setOriginalFile(null);
      return;
    }

    setError(null);
    setOriginalFile(file);
    event.target.value = null;
  }, []);

  const handleDownloadCompressed = useCallback(() => {
    if (compressedImage) {
      const link = document.createElement('a');
      link.href = compressedImage;
      // Suggest a filename with quality and dimensions for clarity
      link.download = `compressed_image_w${imageDimensions}_q${Math.floor(imageQuality * 100)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [compressedImage, imageQuality, imageDimensions]);

  const handleQualityChange = useCallback((event) => {
    setImageQuality(parseFloat(event.target.value)); // Update quality state, triggers useEffect
  }, []);

  const handleDimensionsChange = useCallback((event) => {
    setImageDimensions(parseInt(event.target.value, 10)); // Update dimensions state, triggers useEffect
  }, []);

  return (
    <div className="min-h-screen dark:bg-[#1E201E] bg-gray-100 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="dark:bg-[#3C3D37] bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-center dark:text-[#ECDFCC] text-gray-800 mb-6">
          Image Compressor
        </h1>

        {/* File input section */}
        <div className="mb-6 flex flex-col items-center">
          <label htmlFor="image-upload" className="cursor-pointer text-white border p-2 rounded-xl dark:bg-[#ECDFCC] dark:text-[#1E201E] bg-black/70 dark:hover:bg-[#ECDFCC]/80 hover:bg-black block text-lg font-medium mb-2">
            Upload an Image
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden w-full max-w-md text-sm text-gray-600" // input itself is hidden
          />
          {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Processing image...</p>
          </div>
        )}

        {/* Display area for images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Original Image Display */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Original Image</h2>
            {originalImageUrl ? (
              <img
                src={originalImageUrl}
                alt="Original Uploaded"
                className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            ) : (
              <div className="w-full max-w-[400px] h-64 dark:bg-[#697565] bg-gray-50 rounded-lg flex items-center justify-center dark:text-white text-gray-500">
                No original image uploaded
              </div>
            )}
            {originalImageUrl && (
              <p className="mt-3 text-sm text-gray-500">
                (Click the image to view full size)
              </p>
            )}
          </div>

          {/* Compressed Image Display */}
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Compressed Image</h2>
            {compressedImage ? (
              <>
                <img
                  src={compressedImage}
                  alt="Compressed"
                  className="max-w-full h-auto rounded-lg shadow-md border border-gray-200"
                  style={{ maxHeight: '400px', objectFit: 'contain' }}
                />
                <p className="mt-3 text-sm text-gray-500">
                  (Dimensions/Quality reduced)
                </p>
              </>
            ) : (
              <div className="w-full max-w-[400px] h-64 dark:bg-[#697565] bg-gray-50 rounded-lg flex items-center justify-center dark:text-white text-gray-500">
                No compressed image available
              </div>
            )}
          </div>
        </div>

        <div className="w-full rounded-lg flex flex-col items-center mt-10">
          <div className="flex gap-1">
            {/* Quality Selection */}
            <div className="flex items-center gap-2">
              <label htmlFor="quality-select" className="dark:text-white text-gray-700 font-medium">Quality:</label>
              <select
                id="quality-select"
                value={imageQuality}
                onChange={handleQualityChange}
                className="p-2 border dark:bg-amber-50 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1.0}>100%</option>
                <option value={0.9}>90%</option>
                <option value={0.8}>80%</option>
                <option value={0.7}>70% (Default)</option>
                <option value={0.6}>60%</option>
                <option value={0.5}>50%</option>
                <option value={0.4}>40%</option>
                <option value={0.3}>30%</option>
                <option value={0.2}>20%</option>
                <option value={0.1}>10%</option>
              </select>
            </div>
            {/* Dimensions Selection */}
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <label htmlFor="dimensions-select" className="dark:text-white text-gray-700 font-medium">Width:</label>
              <select
                id="dimensions-select"
                value={imageDimensions}
                onChange={handleDimensionsChange}
                className="p-2 border dark:bg-amber-50 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={400}>400px</option>
                <option value={800}>800px (Default)</option>
                <option value={1200}>1200px</option>
                <option value={1600}>1600px</option>
                <option value={2000}>2000px</option>
              </select>
            </div>
          </div>
          <div className="w-full flex justify-center">
            <button
              onClick={handleDownloadCompressed}
              className="mt-3 px-6 py-3 bg-green-600 text-white font-semibold rounded-full shadow-md
                                hover:bg-green-700 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Download Compressed Image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; // Export the App component as default
