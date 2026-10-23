"use client";

import toast from "react-hot-toast";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { useReducedMotion } from "motion/react";
import Lightbox from "yet-another-react-lightbox";
import DownloadPlugin from "yet-another-react-lightbox/plugins/download";
import Inline from "yet-another-react-lightbox/plugins/inline";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import { Download, Minus, Plus, X } from "@/components/shared/icons";
import { Dialog, DialogClose, DialogPortal, DialogTitle } from "@/components/ui/dialog";

import "yet-another-react-lightbox/styles.css";

export default function ChatLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    const reduceMotion = useReducedMotion();

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogPortal>
                <DialogPrimitive.Popup className="fixed inset-0 z-50 outline-none">
                    <DialogTitle className="sr-only">Photo attachment</DialogTitle>
                    <Lightbox
                        plugins={[Inline, Zoom, DownloadPlugin]}
                        slides={[{ src, alt: "Photo attachment", download: true }]}
                        download={{
                            download: async ({ saveAs }) => {
                                try {
                                    const response = await fetch(src);
                                    if (!response.ok) throw new Error("Download failed");
                                    const blob = await response.blob();
                                    if (!blob.size) throw new Error("Empty photo");
                                    const extensions: Record<string, string> = {
                                        "image/jpeg": "jpg",
                                        "image/png": "png",
                                        "image/webp": "webp",
                                        "image/gif": "gif",
                                        "image/avif": "avif",
                                        "image/svg+xml": "svg",
                                    };
                                    saveAs(blob, `photo.${extensions[blob.type] ?? "jpg"}`);
                                } catch {
                                    toast.error("Couldn't download this photo. Please try again.");
                                }
                            },
                        }}
                        carousel={{ finite: true, preload: 0 }}
                        zoom={{ maxZoomPixelRatio: 4, scrollToZoom: true }}
                        controller={{ aria: false }}
                        toolbar={{
                            buttons: [
                                <DialogClose
                                    key="close"
                                    className="yarl__button"
                                    aria-label="Close photo"
                                >
                                    <X size={28} aria-hidden />
                                </DialogClose>,
                            ],
                        }}
                        styles={{ button: { minWidth: 48, minHeight: 48, padding: 12 } }}
                        animation={
                            reduceMotion ? { fade: 0, swipe: 0, navigation: 0, zoom: 0 } : undefined
                        }
                        render={{
                            buttonPrev: () => null,
                            buttonNext: () => null,
                            iconZoomIn: () => <Plus size={24} aria-hidden />,
                            iconZoomOut: () => <Minus size={24} aria-hidden />,
                            iconDownload: () => <Download size={24} aria-hidden />,
                        }}
                    />
                </DialogPrimitive.Popup>
            </DialogPortal>
        </Dialog>
    );
}
