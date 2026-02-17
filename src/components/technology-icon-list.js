import Image from 'next/image';

export default function TechnologyIconList({ technologies }) {
  return (
    <ul className="m-0 flex h-10 list-none items-center p-0">
      {technologies.map(technology => (
        <li className="p-1" key={technology.id}>
          {technology.iconImageUrl ? (
            <Image alt={technology.title} className="block" height={30} src={technology.iconImageUrl} width={30} />
          ) : (
            <span className="inline-flex h-[30px] w-[30px] items-center justify-center rounded bg-brand-plum-dark text-xs">
              {technology.title.slice(0, 1)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
