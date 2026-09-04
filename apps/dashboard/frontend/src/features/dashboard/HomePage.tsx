import Button from "@/components/buttons/CustomButton";
import type React from "react";
import UserApi from "../account/api/user.api";

export const HomePage: React.FC = () => {
  const fetchUser = async () => {
    const user = await UserApi.getMe();
    console.log(user);
  };
  return (
    <div>
      <Button text="Fetch me" className="mt-10 mx-10" onClick={fetchUser} />
    </div>
  );
};

export default HomePage;
