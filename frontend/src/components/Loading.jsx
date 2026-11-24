import React from 'react';
import LogoImg from '../assets/placehub-mark.svg';
function LoadingComponent() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full ">
      <div className="flex flex-col justify-between items-center">
        <img src={LogoImg} alt="PlaceHub Logo" width="160" height="160" />
        <div className="flex items-center gap-2 mx-2">
          <div className="w-8 h-8 border-4 border-[#312e81] border-t-transparent border-solid rounded-full animate-spin"></div>
          <div className="">
            <p className="text-xl font-medium pt-3 max-sm:text-base text-[#312e81]">
              Getting things ready…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingComponent;
