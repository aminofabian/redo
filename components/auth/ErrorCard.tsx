import Header from "./Header";
import BackButton from "./BackButton";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";

export const ErrorCard = () => {
  return (
    <Card>
      <CardHeader>
        <Header label="Oops!!! Something Isn't Right" />
      </CardHeader>
      <CardFooter>
        <BackButton href="/auth/login" label="Back to LOgin" />
      </CardFooter>
    </Card>
  );
};
