
import { useState } from "react";

export const useLoadingState = () => {
  const [loading, setLoading] = useState(false);
  
  return {
    loading,
    setLoading
  };
};
