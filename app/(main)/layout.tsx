import React from "react";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex w-full flex-1 flex-col">{children}</div>;
};

export default MainLayout;
