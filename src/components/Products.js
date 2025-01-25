import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../api";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Box
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";

const Products = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    product_prize: "",
    product_description: "",
    product_color: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [newProducts, setNewProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        if (user?.id) {
          const data = await getProducts(user.id);
          setProducts(Array.isArray(data?.products) ? data.products : []);
        }
      } catch (err) {
        setError("Failed to load products");
        setProducts([]);
      }
    };
    loadProducts();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNewProducts(prev => prev.slice(1));
      setUpdatedProducts(prev => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [newProducts, updatedProducts]);

  const filteredAndSortedProducts = [...products]
    .filter(product => 
      product?.product_name?.toLowerCase().includes(filterTerm.toLowerCase()) ||
      product?.product_description?.toLowerCase().includes(filterTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch(sortBy) {
        case 'price_asc': return (a.product_prize || 0) - (b.product_prize || 0);
        case 'price_desc': return (b.product_prize || 0) - (a.product_prize || 0);
        case 'name_asc': return (a.product_name || "").localeCompare(b.product_name || "");
        case 'name_desc': return (b.product_name || "").localeCompare(a.product_name || "");
        default: return 0;
      }
    });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.product_name?.trim() || !formData.product_prize) {
        throw new Error("Product name and price are required");
      }

      const priceValue = parseFloat(formData.product_prize);
      if (isNaN(priceValue)) {
        throw new Error("Invalid price format");
      }

      const payload = {
        product_name: formData.product_name.trim(),
        product_prize: priceValue,
        product_description: formData.product_description?.trim() || "",
        product_color: formData.product_color?.trim() || "",
      };

      if (editProduct) {
        payload.product_id = editProduct.product_id;
        await updateProduct(payload);
        setUpdatedProducts(prev => [...prev, editProduct.product_id]);
        const data = await getProducts(user.id);
        setProducts(data.products);
        setSuccess(`${formData.product_name} updated successfully!`);
      } else {
        payload.user_id = user.id;
        const response = await createProduct(payload);
        setNewProducts(prev => [...prev, response.product_id]);
        const data = await getProducts(user.id);
        setProducts(data.products);
        setSuccess(`${formData.product_name} created successfully!`);
      }

      setOpenDialog(false);
      resetForm();
    } catch (err) {
      console.error("Operation error:", err);
      setError(err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        setLoading(true);
        await deleteProduct(productId);
        const data = await getProducts(user.id);
        setProducts(data.products);
        setSuccess("Product deleted successfully!");
      } catch (err) {
        setError("Failed to delete product");
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setEditProduct(null);
    setFormData({
      product_name: "",
      product_prize: "",
      product_description: "",
      product_color: "",
    });
  };

  const handleEditClick = (product) => {
    setEditProduct(product);
    setFormData({
      product_name: product.product_name || "",
      product_prize: product.product_prize?.toString() || "",
      product_description: product.product_description || "",
      product_color: product.product_color || "",
    });
    setOpenDialog(true);
  };

  return (
    <div>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search Products"
          variant="outlined"
          size="small"
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />

        <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort By"
          >
            <MenuItem value="name_asc">Name (A-Z)</MenuItem>
            <MenuItem value="name_desc">Name (Z-A)</MenuItem>
            <MenuItem value="price_asc">Price (Low to High)</MenuItem>
            <MenuItem value="price_desc">Price (High to Low)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ bgcolor: "#4eb054", ml: 'auto' }}
        >
          Create Product
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Color</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedProducts.map((product) => (
              <TableRow 
                key={product?.product_id}
                sx={{
                  backgroundColor: updatedProducts.includes(product?.product_id) 
                    ? '#e8f5e9'
                    : 'inherit',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <TableCell>
                  {product?.product_name || "N/A"}
                  {newProducts.includes(product?.product_id) && (
                    <Chip 
                      label="New" 
                      color="primary" 
                      size="small" 
                      sx={{ ml: 1, fontSize: '0.75rem' }}
                    />
                  )}
                  {updatedProducts.includes(product?.product_id) && (
                    <Chip 
                      label="Updated" 
                      color="success" 
                      size="small" 
                      sx={{ ml: 1, fontSize: '0.75rem' }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  ${product?.product_prize?.toFixed(2) || "0.00"}
                </TableCell>
                <TableCell>
                  {product?.product_description || "No description"}
                </TableCell>
                <TableCell>{product?.product_color || "N/A"}</TableCell>
                <TableCell>
                  <EditIcon
                    sx={{ cursor: "pointer", mr: 1 }}
                    onClick={() => handleEditClick(product)}
                  />
                  <DeleteIcon
                    sx={{ color: "#df5a4e", cursor: "pointer" }}
                    onClick={() => handleDelete(product?.product_id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editProduct ? "Edit Product" : "Create Product"}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleFormSubmit}>
            <TextField
              margin="dense"
              label="Product Name *"
              fullWidth
              value={formData.product_name}
              onChange={(e) =>
                setFormData({ ...formData, product_name: e.target.value })
              }
              error={!!error && !formData.product_name}
              helperText={!formData.product_name ? "Required field" : ""}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Price *"
              type="number"
              fullWidth
              value={formData.product_prize}
              onChange={(e) =>
                setFormData({ ...formData, product_prize: e.target.value })
              }
              inputProps={{
                step: "0.01",
                min: "0"
              }}
              error={!!error && (!formData.product_prize || isNaN(formData.product_prize))}
              helperText={
                !formData.product_prize || isNaN(formData.product_prize)
                  ? "Enter valid price"
                  : ""
              }
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.product_description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  product_description: e.target.value,
                })
              }
            />
            <TextField
              margin="dense"
              label="Color"
              fullWidth
              value={formData.product_color}
              onChange={(e) =>
                setFormData({ ...formData, product_color: e.target.value })
              }
            />
            <Button
              type="submit"
              variant="contained"
              sx={{ mt: 2, bgcolor: "#6f5cc3" }}
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : editProduct ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;