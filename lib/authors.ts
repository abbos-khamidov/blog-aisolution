export interface Author {
  key: string; // matches Frontmatter.author and the URL /authors/<key>
  name: { ru: string; uz: string };
  alternateName?: string; // feeds Person.alternateName in jsonld.ts
  role: { ru: string; uz: string };
  bio: { ru: string; uz: string };
  image: string; // /authors/<key>.jpg, relative to /public
  sameAs: string[]; // LinkedIn, Threads, GitHub, Telegram — feeds Person.sameAs in jsonld.ts
  isFounder: boolean;
}

/**
 * The single source of truth for who is allowed to publish. A post whose
 * `author` key isn't here fails validation in lib/content.ts (задача 4) —
 * this is the guard against fake bylines from claude.md, задача 2.
 *
 * Students are added here the same way, with isFounder: false. Their
 * affiliation to the AI Solution Organization is derived from isFounder,
 * not stored twice — see lib/jsonld.ts (задача 5).
 */
export const authors: Record<string, Author> = {
  aisolution: {
    key: "aisolution",
    name: {
      ru: "AISOLUTION",
      uz: "AISOLUTION"
    },
    role: {
      ru: "Редакция AISOLUTION",
      uz: "AISOLUTION tahririyati"
    },
    bio: {
      ru: "AISOLUTION разбирает AI-продукты, стартапы и технологические рынки Центральной Азии без пресс-релизной ваты.",
      uz: "AISOLUTION Markaziy Osiyodagi AI mahsulotlar, startaplar va texnologik bozorlarni press-reliz paxtasisiz tahlil qiladi."
    },
    image: "/brand/logo-dark-transparent.png",
    sameAs: [],
    isFounder: true
  }
};

export class UnknownAuthorError extends Error {
  constructor(key: string) {
    const known = Object.keys(authors);
    const knownList = known.length > 0 ? known.join(", ") : "(реестр пуст)";
    super(
      `Unknown author key "${key}". Add this author to lib/authors.ts before the post can be built. Known keys: ${knownList}`
    );
    this.name = "UnknownAuthorError";
  }
}

/**
 * Resolves an author key to its registry entry, throwing when the key is
 * missing so an unregistered byline fails the build instead of shipping.
 */
export function resolveAuthor(key: string): Author {
  const author = authors[key];
  if (!author) {
    throw new UnknownAuthorError(key);
  }
  return author;
}

export function listAuthors(): Author[] {
  return Object.values(authors);
}

export function isKnownAuthor(key: string): boolean {
  return key in authors;
}
