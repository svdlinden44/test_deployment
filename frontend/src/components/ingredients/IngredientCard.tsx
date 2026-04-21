import type { IngredientBrowseItem } from '@/lib/api/types'
import { IngredientCabinetButton } from '@/components/ingredients/IngredientCabinetButton'
import { IngredientPlaceholder } from '@/components/ingredients/IngredientPlaceholder'
import { ingredientTypeLabel } from '@/pages/Ingredients/ingredientMeta'
import s from './IngredientCard.module.scss'

export type IngredientCardProps = {
  item: IngredientBrowseItem
  onCabinetChange?: (slug: string, inCabinet: boolean) => void
}

export function IngredientCard({ item, onCabinetChange }: IngredientCardProps) {
  const inCabinet = Boolean(item.is_in_cabinet)

  return (
    <div className={s.cardOuter}>
      <article className={s.card}>
        <div className={s.imgWrap}>
          <div className={s.imgSubject}>
            {item.image_url ? (
              <img src={item.image_url} alt="" className={s.img} />
            ) : (
              <IngredientPlaceholder ingredientType={item.type} />
            )}
          </div>
        </div>
        <div className={s.toolbar}>
          <IngredientCabinetButton
            slug={item.slug}
            inCabinet={inCabinet}
            small
            onChange={(next) => onCabinetChange?.(item.slug, next)}
          />
        </div>
        <div className={s.body}>
          <h2 className={s.title}>{item.name}</h2>
          {item.description ? <p className={s.desc}>{item.description}</p> : null}
          <span className={s.meta}>{ingredientTypeLabel(item.type)}</span>
        </div>
      </article>
    </div>
  )
}
