import Link from "next/link";
import { Badge, LayerBadge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface ConceptCardProps {
  id: string;
  slug: string;
  titleJa: string;
  summary?: string | null;
  tags: string[];
  layerEntries?: Array<{
    layer: { slug: string; nameJa: string };
  }>;
  className?: string;
}

export function ConceptCard({
  slug,
  titleJa,
  summary,
  tags,
  layerEntries,
  className,
}: ConceptCardProps) {
  return (
    <Link href={`/concepts/${slug}`}>
      <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
        <CardBody>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{titleJa}</h3>
          {summary && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{summary}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            {layerEntries?.map((e) => (
              <LayerBadge key={e.layer.slug} slug={e.layer.slug} nameJa={e.layer.nameJa} />
            ))}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
