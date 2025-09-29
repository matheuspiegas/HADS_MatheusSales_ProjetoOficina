"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { signIn } from "../actions/sign-in";

// Schema de validação
const formSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

// Tipo baseado no schema
type FormValues = z.infer<typeof formSchema>;

const SignInForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      const signInResponse = await signIn(data.email, data.password);
      form.setError(`root.invalid_credentials`, {
        type: "invalid_credentials",
        message: "Email ou senha inválidos",
      });
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center space-y-6 p-6">
      {mounted && (
        <Image
          src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"}
          alt="Logo da empresa"
          width={200}
          height={200}
        />
      )}
      <div className="space-y-2 text-center">
        <h1 className="mb-2 text-center text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground">Entre com suas credenciais</p>
      </div>

      <div className="flex w-full max-w-xs flex-col space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              disabled={isLoading}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isLoading}
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <FormMessage>
                {form.formState.errors?.root.invalid_credentials?.message}
              </FormMessage>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <LoaderCircle className="animate-spin" /> : "Entrar"}
            </Button>
          </form>
        </Form>
        <Link href={"/reset-password"} className="text-center underline">
          Esqueceu sua senha?
        </Link>
      </div>
    </div>
  );
};

export default SignInForm;
