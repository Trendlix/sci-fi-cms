import { create } from "zustand";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
} from "@firebase/storage";
import { storage } from "@/shared/config/firebase";

type UploadResult = {
    url: string;
    path: string;
};

interface FirebaseState {
    uploadProgress: number;
    downloadURL: string | null;
    uploadedFiles: string[];
    isUploading: boolean;

    uploadFile: (file: File, path?: string) => Promise<UploadResult>;
    replaceFile: (oldPath: string, newFile: File, path?: string) => Promise<UploadResult>;
    uploadFiles: (files: File[], path?: string) => Promise<UploadResult[]>;
    getFileUrl: (filePath: string) => Promise<string>;
    deleteFile: (filePath: string) => Promise<boolean>;
    deleteFiles: (path?: string) => Promise<boolean>;
}

export const useFirebase = create<FirebaseState>((set, get) => ({
    uploadProgress: 0,
    downloadURL: null,
    uploadedFiles: [],
    isUploading: false,

    uploadFile: async (file, path = "uploads") => {
        return new Promise<UploadResult>((resolve, reject) => {
            const uniqueName = `${Date.now()}_${file.name}`;
            const filePath = `${path}/${uniqueName}`;
            const fileRef = ref(storage, filePath);
            const uploadTask = uploadBytesResumable(fileRef, file);

            set({ isUploading: true });

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progress =
                        (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    set({ uploadProgress: progress });
                },
                (error) => {
                    console.error("Upload error:", error);
                    set({ isUploading: false });
                    reject(error);
                },
                async () => {
                    try {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        set({
                            downloadURL: url,
                            isUploading: false,
                            uploadProgress: 0,
                        });
                        resolve({ url, path: filePath });
                    } catch (err) {
                        set({ isUploading: false });
                        reject(err);
                    }
                }
            );
        });
    },

    replaceFile: async (oldPath, newFile, path = "uploads") => {
        try {
            const oldRef = ref(storage, oldPath);
            await deleteObject(oldRef);
        } catch (e) {
            console.warn("Old file could not be deleted:", e);
        }
        return get().uploadFile(newFile, path);
    },

    uploadFiles: async (files, path = "uploads") => {
        set({ isUploading: true });

        try {
            const uploads: UploadResult[] = [];
            for (const file of files) {
                const result = await get().uploadFile(file, path);
                uploads.push(result);
            }

            set({
                uploadedFiles: uploads.map((item) => item.url),
                isUploading: false,
                uploadProgress: 0,
            });

            return uploads;
        } catch (error) {
            set({ isUploading: false });
            throw error;
        }
    },

    getFileUrl: async (filePath) => {
        const fileRef = ref(storage, filePath);
        return getDownloadURL(fileRef);
    },

    deleteFile: async (filePath) => {
        try {
            const fileRef = ref(storage, filePath);
            await deleteObject(fileRef);
            return true;
        } catch (error) {
            console.error("Delete file error:", error);
            return false;
        }
    },

    deleteFiles: async (path = "uploads") => {
        try {
            const folderRef = ref(storage, path);
            const list = await listAll(folderRef);
            await Promise.all(list.items.map((item) => deleteObject(item)));
            return true;
        } catch (error) {
            console.error("Delete files error:", error);
            return false;
        }
    },
}));
