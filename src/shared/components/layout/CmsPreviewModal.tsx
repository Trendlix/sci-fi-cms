import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePreviewModalStore } from "@/shared/hooks/store/ui/usePreviewModalStore";

const CmsPreviewModal = () => {
    const { isOpen, payload, close } = usePreviewModalStore();

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => (open ? null : close())}>
            <AlertDialogContent className="max-w-5xl bg-[#121212] text-white">
                <AlertDialogHeader className="items-start text-left">
                    <AlertDialogTitle>{payload?.title ?? "Preview"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="min-h-[40vh] w-full">
                    {payload?.type === "link" && payload.url ? (
                        <iframe
                            src={payload.url}
                            title="Link preview"
                            className="h-[70vh] w-full rounded-xl border border-white/10"
                        />
                    ) : payload?.type === "video" && payload.url ? (
                        <video
                            src={payload.url}
                            controls
                            className="max-h-[70vh] w-full rounded-xl border border-white/10"
                        />
                    ) : payload?.url ? (
                        <img
                            src={payload.url}
                            alt="Image preview"
                            className="max-h-[70vh] w-full rounded-xl border border-white/10 object-contain"
                        />
                    ) : null}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel asChild>
                        <Button
                            type="button"
                            className="bg-white/10 text-white hover:bg-white/20"
                        >
                            Close
                        </Button>
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default CmsPreviewModal;

