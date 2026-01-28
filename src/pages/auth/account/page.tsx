import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { AuthBackground, AuthCard } from "@/shared/ui/common-layout"
import { useAuth } from "@/shared/hooks/store/useAuth"
import { useNavigate } from "react-router-dom"

const AccountPage = () => {
    const { account, status, error } = useAuth()
    const navigate = useNavigate()
    const accountForm = useForm({
        defaultValues: {
            user_name: "",
            password: "",
        },
        resolver: zodResolver(
            z.object({
                user_name: z.string().min(3).max(20),
                password: z.string().min(8),
            })
        ),
    })

    const onSubmit = accountForm.handleSubmit(async (values) => {
        const response = await account({ user_name: values.user_name, password: values.password })
        if (response.ok) {
            navigate("/cms/home", { replace: true })
        }
    })

    return (
        <AuthBackground>
            <FormProvider {...accountForm}>
                <form onSubmit={onSubmit}>
                    <AuthCard className="flex flex-col gap-5">
                        <div className="flex items-center justify-between gap-2 text-white">
                            <div className="flex justify-center">
                                <img src="/brand/logo.png" alt="logo" width={100} height={100} />
                            </div>
                            <div className="space-y-1 text-end">
                                <h1 className="text-2xl font-semibold text-white max-sm:text-sm">Welcome back</h1>
                                <p className="text-sm text-white/70 max-sm:text-xs">Sign in now</p>
                            </div>
                        </div>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="email" className="text-white/80">
                                    User Name
                                </FieldLabel>
                                <Input
                                    id="user_name"
                                    type="text"
                                    placeholder="Enter your user name"
                                    autoComplete="user_name"
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    {...accountForm.register("user_name")}
                                />
                            </Field>
                        </FieldGroup>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password" className="text-white/80">
                                    Password
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white/40"
                                    {...accountForm.register("password")}
                                />
                            </Field>
                        </FieldGroup>
                        {error ? (
                            <p className="text-sm text-red-300">{error}</p>
                        ) : null}
                        <Button
                            type="submit"
                            className="w-full bg-white/90 text-black hover:bg-white"
                            disabled={status === "loading"}
                        >
                            {status === "loading" ? "Signing in..." : "Sign in"}
                        </Button>
                    </AuthCard>
                </form>
            </FormProvider>
        </AuthBackground>
    )
}

export default AccountPage