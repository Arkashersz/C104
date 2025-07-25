// lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
}

export function calculateDaysBetween(date1: string | Date, date2: string | Date): number {
  const firstDate = new Date(date1)
  const secondDate = new Date(date2)
  const timeDifference = secondDate.getTime() - firstDate.getTime()
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24))
}

export function generateContractNumber(): string {
  const year = new Date().getFullYear()
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `CTR-${year}-${randomNumber}`
}

export function generateProcessNumber(): string {
  const year = new Date().getFullYear()
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `LIC-${year}-${randomNumber}`
}

export function exportToCSV(filename: string, rows: object[]) {
  if (!rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(separator),
    ...rows.map(row => keys.map(k => '"' + String(row[k] ?? '').replace(/"/g, '""') + '"').join(separator))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}