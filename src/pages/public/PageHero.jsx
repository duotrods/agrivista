import { PublicPhoto } from '../../components/common/PublicPhoto'

/** Shorter photo banner at the top of the public pages. */
export function PageHero({ chip, title, text, photo }) {
  return (
    <section className="lp-hero is-short">
      <PublicPhoto src={photo} alt="" className="lp-hero-img" />
      <div className="lp-hero-shade" />
      <div className="lp-hero-content">
        <span className="lp-chip is-light">{chip}</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </section>
  )
}
