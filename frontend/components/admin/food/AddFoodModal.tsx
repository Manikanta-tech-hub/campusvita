import { useState } from "react";
import { addFood } from "@/app/lib/api";
type Category = {
  id: string;
  name: string;
};
type AddFoodModalProps = {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  };
  export default function AddFoodModal({
    open,
    onClose,
    onSuccess,
  }: AddFoodModalProps) {
    const [form, setForm] = useState({
      name: "",
      description: "",
      category: "",
      category_id: "",
      price: "",
      available: true,
    });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
const [categoryLoading, setCategoryLoading] = useState(false);
const [categoryError, setCategoryError] = useState("");
const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
const [categorySearch, setCategorySearch] = useState("");
const [selectedCategory, setSelectedCategory] =
  useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) {
        setForm({
          ...form,
          [e.target.name]: e.target.value,
        });
      }
      async function handleSubmit() {
        try {
          setLoading(true);
      
          const token = localStorage.getItem("access_token");
      
          if (!token) {
            alert("Please login again");
            setLoading(false);
            return;
          }
          if (!form.name.trim()) {
            alert("Food name is required");
            setLoading(false);
            return;
          }
          
          if (!form.description.trim()) {
            alert("Description is required");
            setLoading(false);
            return;
          }
          
          if (!selectedCategory) {
            alert("Please select a category");
            setLoading(false);
            return;
          }
          
          if (Number(form.price) <= 0) {
            alert("Enter a valid price");
            setLoading(false);
            return;
          }
          
          if (!imageFile) {
            alert("Please select an image");
            setLoading(false);
            return;
        }
        console.log("Food Form:", form);
        console.log("Selected Category:", selectedCategory);
          await addFood(form,imageFile!,token);
          alert("Food added successfully!");

          setForm({
            name: "",
            description: "",
            category: "",
            category_id: "",
            price: "",
            available: true,
          });
          
          setSelectedCategory(null);
          setCategorySearch("");
          setCategoryDropdownOpen(false);
          setCategoryError("");
        setImageFile(null);
          onSuccess();
          onClose();
      
        } catch (error) {
          alert("Failed to add food");
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
      async function fetchCategories() {
        try {
          setCategoryLoading(true);
          setCategoryError("");
      
          const token = localStorage.getItem("access_token");
      
          if (!token) {
            setCategoryError("Please login again.");
            return;
          }
      
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL ||
            "http://127.0.0.1:8000";
      
          const response = await fetch(
            `${API_URL}/admin/categories?status_filter=ACTIVE&sort=NAME_ASC&page=1&limit=100`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
      
          if (!response.ok) {
            throw new Error("Failed to fetch categories");
          }
      
          const result = await response.json();
      
          console.log("Categories API response:", result);
      
          setCategories(result.categories || []);
        } catch (error) {
          console.error(
            "Category loading error:",
            error
          );
      
          setCategoryError(
            "Failed to load categories."
          );
        } finally {
          setCategoryLoading(false);
        }
      }
      const filteredCategories = categories.filter((category) =>
        category.name
          .toLowerCase()
          .includes(categorySearch.toLowerCase())
      );
    if (!open) return null;
  
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
      
            <h2 className="text-2xl font-bold mb-4">
              Add Food
            </h2>
      
            <input
              type="text"
              name="name"
              placeholder="Food Name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
      
            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
      
      <div className="relative mb-3">

{/* Category Field */}
<button
  type="button"
  onClick={() => {
    setCategoryDropdownOpen((prev) => !prev);

    if (!categoryDropdownOpen) {
      fetchCategories();
    }
  }}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
>
  {selectedCategory ? (
    selectedCategory.name
  ) : (
    <span className="text-gray-400">
      Category
    </span>
  )}
</button>

{/* Dropdown */}
{categoryDropdownOpen && (
  <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">

    {/* Search */}
    <div className="p-2 border-b border-gray-200">
      <input
        type="text"
        placeholder="Search category..."
        value={categorySearch}
        onChange={(e) =>
          setCategorySearch(e.target.value)
        }
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-black text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* Loading */}
    {categoryLoading && (
      <div className="px-4 py-3 text-sm text-gray-500">
        Loading categories...
      </div>
    )}

    {/* Error */}
    {!categoryLoading && categoryError && (
      <div className="px-4 py-3 text-sm text-red-500">
        {categoryError}
      </div>
    )}

    {/* Empty */}
    {!categoryLoading &&
      !categoryError &&
      filteredCategories.length === 0 && (
        <div className="px-4 py-3 text-sm text-gray-500">
          No categories found.
        </div>
      )}

    {/* Categories */}
    {!categoryLoading &&
      !categoryError &&
      filteredCategories.length > 0 && (
        <div className="max-h-52 overflow-y-auto">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategory(category);

                setForm({
                  ...form,
                  category: category.name,
                  category_id: category.id,
                });

                setCategoryDropdownOpen(false);
                setCategorySearch("");
                setCategoryError("");
              }}
              className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

  </div>
)}
</div>
      
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={form.price}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
      
      <input
    type="file"
    accept="image/*"
    onChange={(e) => {
        if (e.target.files?.length) {
            setImageFile(e.target.files[0]);
        }
    }}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-3 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
/>
{imageFile && (
    <img
        src={URL.createObjectURL(imageFile)}
        alt="Preview"
        className="w-32 h-32 rounded-lg object-cover border mt-2"
    />
)}
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) =>
                  setForm({
                    ...form,
                    available: e.target.checked,
                  })
                }
              />
              Available
            </label>
      
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
      
              <button
  onClick={handleSubmit}
  disabled={loading}
  className="px-4 py-2 bg-orange-500 text-white rounded"
>
  {loading ? "Adding..." : "Add Food"}
</button>
            </div>
      
          </div>
        </div>
      );
  }