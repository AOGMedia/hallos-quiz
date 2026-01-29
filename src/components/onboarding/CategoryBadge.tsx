import { Plus } from "lucide-react";

interface CategoryBadgeProps {
  name: string;
  isSelected?: boolean;
  onClick?: () => void;
  showPlus?: boolean;
}

const CategoryBadge = ({ name, isSelected = false, onClick, showPlus = false }: CategoryBadgeProps) => {
  return (
    <button
      onClick={onClick}
      className={isSelected ? "badge-category-selected" : "badge-category"}
    >
      {showPlus && <Plus className="w-4 h-4 inline mr-1" />}
      {name}
    </button>
  );
};

export default CategoryBadge;
