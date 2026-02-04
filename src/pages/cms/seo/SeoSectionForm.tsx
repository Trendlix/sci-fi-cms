import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState } from "react";
import CommonLanguageSwitcherCheckbox from "@/shared/common/CommonLanguageSwitcherCheckbox";
import { useHomeLanguageStore } from "@/shared/hooks/store/home/home-language.store";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeoStore } from "@/shared/hooks/store/seo/useSeoStore";
import type { SeoSectionKey } from "@/shared/hooks/store/seo/seo.types";
import { X } from "lucide-react";

const keywordItemSchema = z.object({
    value: z.string().min(1, "Keyword is required"),
});

export const SeoSectionZodSchema = z.object({
    filesAlt: z.string().min(1, "Files alt is required"),
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    keywords: z.array(keywordItemSchema).min(1),
});

type SeoSectionFormValues = z.infer<typeof SeoSectionZodSchema>;

const defaultValues: SeoSectionFormValues = {
    filesAlt: "",
    title: "",
    description: "",
    keywords: [],
};

type SeoSectionFormProps = {
    section: SeoSectionKey;
    title: string;
    subtitle?: string;
};

const SeoSectionForm = ({ section, title, subtitle }: SeoSectionFormProps) => {
    const { data, get, update, getLoading, updateLoading } = useSeoStore();
    const language = useHomeLanguageStore((state) => state.language);
    const isRtl = language === "ar";
    const hasInitialized = useRef(false);
    const form = useForm<SeoSectionFormValues>({
        defaultValues,
        resolver: zodResolver(SeoSectionZodSchema),
        mode: "onChange",
    });

    const [keywordInput, setKeywordInput] = useState("");
    const keywordsFieldArray = useFieldArray({
        control: form.control,
        name: "keywords",
    });
    const keywordValues = useMemo(
        () => keywordsFieldArray.fields.map((item) => item.value),
        [keywordsFieldArray.fields]
    );

    useEffect(() => {
        hasInitialized.current = false;
        void get(section);
    }, [get, language, section]);

    useEffect(() => {
        const current = data?.[section] ?? null;
        if (current === null || hasInitialized.current) {
            return;
        }
        form.reset({
            filesAlt: current.filesAlt ?? "",
            title: current.title ?? "",
            description: current.description ?? "",
            keywords: current.keywords?.length ? current.keywords.map((value) => ({ value })) : [],
        });
        hasInitialized.current = true;
    }, [data, form, section]);

    const toList = (items: { value: string }[]) => items.map((item) => item.value.trim()).filter(Boolean);

    const addKeyword = (raw: string) => {
        const trimmed = raw.trim().replace(/,$/, "");
        if (!trimmed) {
            return;
        }
        if (keywordValues.includes(trimmed)) {
            setKeywordInput("");
            return;
        }
        keywordsFieldArray.append({ value: trimmed });
        void form.trigger("keywords");
        setKeywordInput("");
    };

    const removeKeyword = (value: string) => {
        const index = keywordValues.findIndex((item) => item === value);
        if (index >= 0) {
            keywordsFieldArray.remove(index);
            void form.trigger("keywords");
        }
    };

    const onSubmit = async (values: SeoSectionFormValues) => {
        await update(section, {
            filesAlt: values.filesAlt.trim(),
            title: values.title.trim(),
            description: values.description.trim(),
            keywords: toList(values.keywords),
        });
    };

    if (getLoading) {
        return (
            <div className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-40" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", isRtl && "home-rtl")}>
                <CommonLanguageSwitcherCheckbox />
                <div className="space-y-1 text-white">
                    <h1 className="text-2xl font-semibold text-white">{title}</h1>
                    <p className="text-sm text-white/70">{subtitle ?? "Update SEO metadata"}</p>
                </div>
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                    <Field>
                        <FieldLabel htmlFor={`${section}-files-alt`} className="text-white/80">
                            Files Alt <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${section}-files-alt`}
                                placeholder="Enter files alt"
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register("filesAlt")}
                            />
                            <FieldError errors={[form.formState.errors.filesAlt]} />
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor={`${section}-title`} className="text-white/80">
                            Title <span className="text-white">*</span>
                        </FieldLabel>
                        <FieldContent>
                            <Input
                                id={`${section}-title`}
                                placeholder="Enter title"
                                className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                {...form.register("title")}
                            />
                            <FieldError errors={[form.formState.errors.title]} />
                        </FieldContent>
                    </Field>
                </FieldGroup>
                <Field>
                    <FieldLabel htmlFor={`${section}-description`} className="text-white/80">
                        Description <span className="text-white">*</span>
                    </FieldLabel>
                    <FieldContent>
                        <Textarea
                            id={`${section}-description`}
                            placeholder="Enter description"
                            className="min-h-28 border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                            {...form.register("description")}
                        />
                        <FieldError errors={[form.formState.errors.description]} />
                    </FieldContent>
                </Field>
                <Field>
                    <FieldLabel className="text-white/80">Keywords</FieldLabel>
                    <FieldContent>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                                {keywordValues.map((value) => (
                                    <span
                                        key={value}
                                        className="group inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80"
                                    >
                                        {value}
                                        <button
                                            type="button"
                                            onClick={() => removeKeyword(value)}
                                            aria-label={`Remove ${value}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Type keyword and press Enter or comma"
                                    value={keywordInput}
                                    onChange={(event) => setKeywordInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === ",") {
                                            event.preventDefault();
                                            addKeyword(keywordInput);
                                        }
                                    }}
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                />
                                <Button
                                    type="button"
                                    className="bg-white/10 text-white hover:bg-white/20"
                                    onClick={() => addKeyword(keywordInput)}
                                >
                                    Add
                                </Button>
                            </div>
                            <FieldError errors={[form.formState.errors.keywords]} />
                        </div>
                    </FieldContent>
                </Field>
                <Button
                    type="submit"
                    className="w-full bg-white/90 text-black hover:bg-white"
                    disabled={getLoading || updateLoading || !form.formState.isValid}
                >
                    {updateLoading ? "Saving..." : "Save"}
                </Button>
            </form>
        </FormProvider>
    );
};

export default SeoSectionForm;

