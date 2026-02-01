function validateImage(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (!allowed.includes(file.type)) {
    throw new Error("Only JPG, PNG, or WEBP images allowed");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Max file size is 2MB");
  }
}

export default async function uploadAvatar(file) {
    validateImage(file);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "avatar_upload");

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/dbnqmahld/image/upload",
        {
        method: "POST",
        body: formData,
        }
    );

    const data = await res.json();
    return data.secure_url; // ✅ store this
}
