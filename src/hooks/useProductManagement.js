import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const normalizeRecipe = (recipe) => {
  if (!recipe || typeof recipe !== "object") {
    return {};
  }

  const toInteger = (value) => {
    const num = Number(value);
    return Number.isInteger(num) ? num : null;
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  return {
    ...recipe,
    id: recipe.id ?? null,
    stock_id:
      recipe.stock_id !== undefined && recipe.stock_id !== null
        ? toInteger(recipe.stock_id)
        : recipe.stockId !== undefined && recipe.stockId !== null
          ? toInteger(recipe.stockId)
          : null,
    quantity:
      recipe.quantity !== undefined && recipe.quantity !== null
        ? toNumber(recipe.quantity)
        : recipe.quantity_needed !== undefined && recipe.quantity_needed !== null
          ? toNumber(recipe.quantity_needed)
          : 0,
    stock_unit_cost: toNumber(recipe.stock_unit_cost),
  };
};

const normalizeProduct = (product) => {
  if (!product || typeof product !== "object") {
    return {
      selling_price: 0,
      current_stock: 0,
      total_sales: 0,
      total_sold: 0,
      recipes: [],
    };
  }

  return {
    ...product,
    id:
      product.id !== undefined && product.id !== null
        ? Number(product.id)
        : product.id,
    selling_price: Number(product.selling_price ?? 0),
    current_stock: Number(product.current_stock ?? 0),
    total_sales: Number(product.total_sales ?? 0),
    total_sold: Number(product.total_sold ?? 0),
    recipes: Array.isArray(product.recipes)
      ? product.recipes.map((recipe) => normalizeRecipe(recipe))
      : [],
  };
};

const fetchProducts = async () => {
  const response = await fetch("/api/products");
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : "Failed to fetch products";
    const requestError = new Error(message);
    requestError.status = response.status;
    throw requestError;
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload;
};

const normalizeProducts = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((product) => normalizeProduct(product));
};

export function useProductManagement() {
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    select: normalizeProducts,
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Failed to create product";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return normalizeProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ productId, items }) => {
      if (!productId) {
        throw new Error("productId is required to update a recipe");
      }

      const response = await fetch(`/api/products/${productId}/recipes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      if (!response.ok) {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "Failed to update product recipe";
        const requestError = new Error(message);
        requestError.status = response.status;
        throw requestError;
      }

      return {
        productId: payload?.productId ?? productId,
        recipes: Array.isArray(payload?.recipes)
          ? payload.recipes.map((recipe) => normalizeRecipe(recipe))
          : [],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    products,
    isLoading,
    isFetching,
    isError,
    error,
    createProduct: createProductMutation.mutate,
    createProductAsync: createProductMutation.mutateAsync,
    createProductLoading: createProductMutation.isLoading,
    updateRecipe: updateRecipeMutation.mutate,
    updateRecipeAsync: updateRecipeMutation.mutateAsync,
    updateRecipeLoading: updateRecipeMutation.isLoading,
  };
}
