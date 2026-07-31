import axios from "axios";

const CHAPA_URL = "https://api.chapa.co/v1/transaction/initialize";

export const initializeChapa = async (paymentData) => {
  const response = await axios.post(
    CHAPA_URL,
    paymentData,
    {
      headers: {
        Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};