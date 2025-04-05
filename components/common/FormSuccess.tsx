import { CheckCircledIcon } from "@radix-ui/react-icons";

interface FormSuccessProps {
  message?: string;
}

const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) {
    return null;
  }
  return (
    <div className="bg-emerald-200/70 p-3 rounded-md flex item-center gap-x-2 text-xs font-light text-emerald-500">
      <CheckCircledIcon className="h-7 w-7" />
      <p>{message}</p>
    </div>
  );
};

export default FormSuccess;
