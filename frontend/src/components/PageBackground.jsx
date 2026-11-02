const BACKGROUNDS = {
  jungle: "/bg/jungle.jpg",
  feed: "/bg/feed.jpg",
  circuits: "/bg/circuits.jpg",
  hotels: "/bg/hotels.jpg",
  lieux: "/bg/lieux.jpg",
  login: "/bg/login.jpg",
};

export default function PageBackground({
  name = "jungle",
  position = "center",
}) {
  const src = BACKGROUNDS[name] || BACKGROUNDS.jungle;

  return (
    <div
      aria-hidden="true"
      className="bg-jungle-fallback fixed inset-0 -z-10"
    >
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: position,
        }}
      />
      <div className="bg-veil absolute inset-0" />
    </div>
  );
}
