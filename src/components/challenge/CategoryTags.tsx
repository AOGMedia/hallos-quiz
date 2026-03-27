interface CategoryTagsProps {
  categories: string[];
  label?: string;
}

const CategoryTags = ({ categories, label }: CategoryTagsProps) => (
  <div>
    {label && (
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
    )}
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {categories.map((cat) => (
        <span
          key={cat}
          className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs border border-primary/50 text-primary bg-primary/10 font-medium"
        >
          {cat}
        </span>
      ))}
    </div>
  </div>
);

export default CategoryTags;
