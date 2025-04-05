import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface FormErrorProps {
  message?: string;
}

const FormError = ({ message }: FormErrorProps) => {
  if (!message) {
    return null;
  }
  return (
    <div className="bg-destructive/15 p-3 rounded-md flex item-center gap-x-2 text-xs font-light text-destructive">
      <ExclamationTriangleIcon className="h-10 w-10" />
      <p>{message}</p>
    </div>
  );
};

export default FormError;
