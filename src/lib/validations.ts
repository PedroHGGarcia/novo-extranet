import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const clienteSchema = z.object({
  documento: z
    .string()
    .min(11, 'CPF/CNPJ deve ter no mínimo 11 caracteres')
    .max(18, 'CPF/CNPJ deve ter no máximo 18 caracteres'),
  fantasia: z.string().min(2, 'Nome Fantasia deve ter no mínimo 2 caracteres'),
  razao_social: z
    .string()
    .min(2, 'Razão Social deve ter no mínimo 2 caracteres')
    .optional()
    .or(z.literal('')),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  email_fiscal: z.string().email('E-mail fiscal inválido').optional().or(z.literal('')),
  telefone: z.string().min(8, 'Telefone deve ter no mínimo 8 caracteres'),
  telefone_2: z.string().optional(),
  telefone_3: z.string().optional(),
  celular: z.string().optional(),
  cep: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complementos: z.string().optional(),
  limite_credito: z.union([z.number(), z.string()]).optional(),
})

export type ClienteFormData = z.infer<typeof clienteSchema>

export const propostaSchema = z.object({
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  versao: z.string().min(1, 'Versão é obrigatória'),
  valor_final: z.number().positive('Valor deve ser positivo').optional(),
  valor_sem_desconto: z.number().positive('Valor deve ser positivo').optional(),
  representante: z.string().min(1, 'Representante é obrigatório'),
  status: z.enum(['Em Análise', 'Aprovada', 'Recusada', 'Excluída']).default('Em Análise'),
  moeda: z.string().optional(),
  percentual_desconto: z.number().min(0).max(100).optional(),
  prazo_entrega: z.string().optional(),
  condicoes_pagamento: z.string().optional(),
})

export type PropostaFormData = z.infer<typeof propostaSchema>

export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  status: z.enum(['Ativo', 'Inativo']).default('Ativo'),
  descricao: z.string().optional(),
})

export type ProdutoFormData = z.infer<typeof produtoSchema>

export const projetoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cliente: z.string().min(1, 'Cliente é obrigatório'),
  descricao: z.string().optional(),
  status: z.enum(['Em Andamento', 'Concluído', 'Cancelado', 'Suspenso']).default('Em Andamento'),
})

export type ProjetoFormData = z.infer<typeof projetoSchema>
