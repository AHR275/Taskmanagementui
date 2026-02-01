export  function isValidCloudinaryImage(url) {
  return (
    typeof url === "string" &&
    url.startsWith("https://res.cloudinary.com/") &&
    url.includes("/image/upload/")
  );
}