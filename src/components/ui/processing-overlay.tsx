import { cn } from "@/components/ui/cn";
import { ProcessingState } from "@/components/ui/processing-state";

type ProcessingOverlayProps = {
    title: string;
    description?: string;
    className?: string;
};

export function ProcessingOverlay({ title, description, className }: ProcessingOverlayProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,255,255,0.45)] px-6 backdrop-blur-[1px]",
                className,
            )}
        >
            <ProcessingState title={title} description={description} className="max-w-sm" />
        </div>
    );
}
