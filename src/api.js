import axios from "axios";

const api = axios.create({
  baseURL: "https://backend.teemify.biz",
  headers: {
    "Content-Type": "application/json",
  },
});

export const loginUser = async (credentials) => {
  const response = await api.post("/v1/login", credentials);
  return response.data;
};

export const getProducts = async (userId) => {
  const response = await api.post("/list_products", { user_id: userId });
  return response.data;
};

export const createProduct = async (productData) => {
  const payload = {
    product_name: productData.product_name,
    product_prize: parseFloat(productData.product_prize),
    product_description: productData.product_description || "",
    product_color: productData.product_color || "Red",
    user_id: productData.user_id,
  };

  const response = await api.post("/create_product", payload);
  return response.data;
};
export const updateProduct = async (productData) => {
  const response = await api.post("/update_product", {
    ...productData,
    product_price: parseFloat(productData.product_price),
  });
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.post("/delete_product", {
    product_id: productId,
  });
  return response.data;
};
