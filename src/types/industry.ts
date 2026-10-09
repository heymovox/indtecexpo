export interface Industry {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  icon: string;
  image: string;
  sectors: string[];
  featured?: boolean;
}

export interface IndustrySector {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: string;
  exhibitorProfile: string[];
}
