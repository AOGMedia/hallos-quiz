interface RankBadgeProps {
  rank: number;
}

const RankBadge = ({ rank }: RankBadgeProps) => {
  if (rank === 1) return <span className="text-lg sm:text-xl">🥇</span>;
  if (rank === 2) return <span className="text-lg sm:text-xl">🥈</span>;
  if (rank === 3) return <span className="text-lg sm:text-xl">🥉</span>;
  return (
    <span className="text-xs sm:text-sm font-bold text-muted-foreground w-6 text-center">
      #{rank}
    </span>
  );
};

export default RankBadge;
