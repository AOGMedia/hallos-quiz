import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isActive?: boolean;
}

const FeatureCard = ({ icon: Icon, title, description, isActive = false }: FeatureCardProps) => {
  return (
    <div
      className={`card-feature transition-all duration-300 ${
        isActive ? "border-primary/50 bg-card" : "border-border"
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;
