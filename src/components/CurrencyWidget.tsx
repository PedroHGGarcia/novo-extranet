import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Euro } from 'lucide-react'

type CurrencyData = {
  code: string
  codein: string
  name: string
  bid: string
  pctChange: string
  varBid: string
}

export function CurrencyWidget() {
  const [currencies, setCurrencies] = useState<{ USD: CurrencyData; EUR: CurrencyData } | null>(
    null,
  )
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok')
        return res.json()
      })
      .then((data) => {
        setCurrencies({
          USD: data.USDBRL,
          EUR: data.EURBRL,
        })
      })
      .catch((err) => {
        console.error('Failed to fetch currencies:', err)
        setError(true)
      })
  }, [])

  if (error) {
    return null // Gracefully hide on error
  }

  if (!currencies) {
    return (
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Card className="flex-1 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderCurrency = (data: CurrencyData, icon: React.ReactNode) => {
    const current = parseFloat(data.bid)
    const varBid = parseFloat(data.varBid)
    // Previous close can be calculated as current - varBid.
    const previous = current - varBid
    const pctChange = parseFloat(data.pctChange)
    const isPositive = pctChange > 0
    const isNegative = pctChange < 0

    return (
      <Card className="flex-1 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full">{icon}</div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {data.name.split('/')[0]}
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  R$ {current.toFixed(4)}
                </p>
                <span
                  className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-md ${
                    isPositive
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : isNegative
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  ) : null}
                  {Math.abs(pctChange).toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Fechamento anterior: R$ {previous.toFixed(4)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {renderCurrency(
        currencies.USD,
        <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      )}
      {renderCurrency(
        currencies.EUR,
        <Euro className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      )}
    </div>
  )
}
