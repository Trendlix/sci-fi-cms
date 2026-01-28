import { useEffect } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { useFirebase } from "@/shared/hooks/firebase/useFirebase";

const CmsUploadOverlay = () => {
    const isUploading = useFirebase((state) => state.isUploading);
    const uploadProgress = useFirebase((state) => state.uploadProgress);

    useEffect(() => {
        if (!isUploading) {
            return undefined;
        }
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isUploading]);

    if (!isUploading) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-black/60 p-6 text-white shadow-2xl">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5">
                        <UploadCloud className="h-6 w-6 text-white/90" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold">Uploading files</h2>
                        <p className="text-sm text-white/70">
                            Please keep this page open until the upload finishes.
                        </p>
                    </div>
                </div>
                <div className="mt-5">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-white/90 transition-[width]"
                                style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
                            />
                        </div>
                        <span className="text-sm tabular-nums text-white/70">
                            {Math.round(uploadProgress)}%
                        </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm text-white/70">
                        <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                        Uploading...
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CmsUploadOverlay;

