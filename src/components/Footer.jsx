import spaceshipLogo from '@/assets/SpaceshipTripLogo.png';
import vibecodedmonkey from '@/assets/vibecodedmonkey.png';

export default function Footer() {
  return (
    <footer className="mt-auto w-full px-4 pb-4 pt-2">
      <div className="mx-auto max-w-7xl rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-900 py-6 shadow-soft">
      <div className="flex flex-col items-center gap-4 px-4">

        {/* Logos + app name */}
        <div className="flex items-center gap-3">
          <img
            src={spaceshipLogo}
            alt="SpaceshipTrip Logo"
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
          <div className="text-center">
            <span className="block text-base font-bold text-white">Move Yo' Azz App</span>
            <span className="text-xs text-blue-300">fitness.nadabarkada.com</span>
          </div>
          <img
            src={vibecodedmonkey}
            alt="VibeCoded Monkey Logo"
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-blue-200">
          <a
            href="https://github.com/spaceshiptrip"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            SpaceshipTrip | PnB 
          </a>
          <span className="text-blue-400">·</span>
          <a
            href="https://github.com/spaceshiptrip/nadabarkada-fitness"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            Repo
          </a>
        </div>

        {/* Challenge tagline */}
        <div className="text-center text-xs text-blue-300">
          <div>First Annual NadaBarkada Fitness Challenge · May 2026</div>
          <div className="mt-1 italic text-blue-400">"Beets, Bears, Battlestar Galactica"</div>
        </div>

      </div>
      </div>
    </footer>
  );
}
