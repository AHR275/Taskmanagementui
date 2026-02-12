export default function Alert({
  title,
  description,
  variant = "info", // info | success | warning | error
  onClose,
  isOpen
}) {

    if(!isOpen)return null ;
  const variants = {
    info: {
      container: "alert alert-primary",
      icon: "text-blue-500",
    },
    success: {
      container: "alert alert-success",
      icon: "text-green-500",
    },
    warning: {
      container: "alert alert-warning",
      icon: "text-yellow-500",
    },
    error: {
      container: "alert alert-danger",
      icon: "text-red-500",
    },
  };

  const style = variants[variant] || variants.info;

  return (
    <div
      className={`w-full border rounded-xl  shadow-sm flex items-start gap-3 ${style.container}`}
      role="alert"
    >
      <div className={`text-xl ${style.icon}`}>
        {variant === "success" && "✅"}
        {variant === "error" && "❌"}
        {variant === "warning" && "⚠️"}
        {variant === "info" && "ℹ️"}
      </div>

      <div className="flex-1">
        {title && (
          <h4 className="font-semibold text-sm mb-1">
            {title}
          </h4>
        )}
        {description && (
          <p className="text-sm opacity-90">
            {description}
          </p>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-sm font-medium opacity-70 hover:opacity-100 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}
