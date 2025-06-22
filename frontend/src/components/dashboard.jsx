import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";


import grass from "./assets/grass.png";
import tree from "./assets/tree.jpg";
import houseImage from "./assets/houses.jpg";
import player from "./assets/ball.png";
import wall from "./assets/wall.png";
import path from "./assets/path.png";
import player_path from "./assets/player_test.png";
import RetroChat from "./RetroChat";

const TILE_MAP = {
  G: grass,
  T: tree,
  W: wall,
  H: grass,
  R: path,
};

const ROOM_ID = "room1";
const HOUSE_SIZE = 5;
const WALKABLE_TILES = new Set(["G", "R"]);

function Dashboard() {
  const navigate = useNavigate();
  const [map, setMap] = useState(null);
  const [tileSize, setTileSize] = useState(0);
  const [gridDims, setGridDims] = useState({ rows: 0, cols: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [housePositions, setHousePositions] = useState([]);
  const [playerPos, setPlayerPos] = useState({ row: 0, col: 0 });
  const [isJumping, setIsJumping] = useState(false);
  const [isColliding, setIsColliding] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState({});
  const [adjacentTo, setAdjacentTo] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState("");

  const socket = useRef(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      console.warn("⚠️ No username found. Redirecting to login.");
      navigate("/login");
      return;
    }

    socket.current = new WebSocket(`ws://localhost:8080/ws?username=${storedUsername}`);

    socket.current.onopen = () => {
      console.log("✅ WebSocket connected with username:", storedUsername);
    };

    socket.current.onerror = (e) => {
      console.error("❌ WebSocket error:", e);
    };

    socket.current.onclose = () => {
      console.warn("⚠️ WebSocket connection closed");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const currentUser = localStorage.getItem("username");

      if (data.type === "position" && data.username !== currentUser) {
        setOtherPlayers((prev) => ({
          ...prev,
          [data.username]: { row: data.row, col: data.col },
        }));
      }

      if (data.type === "proximity") {
        if (data.target === currentUser) {
          if (data.action === "approach") {
            setAdjacentTo(data.username);
          } else if (data.action === "leave" && adjacentTo === data.username) {
            setAdjacentTo(null);
            setIsChatOpen(false);
            setChatRecipient("");
          }
        }
      }
    };

    return () => socket.current && socket.current.close();
  }, [navigate, adjacentTo]);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/room/${ROOM_ID}`);
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          const rows = data.length;
          const cols = data[0].length;
          const newMap = data.map((row) => [...row]);

          const houses = [];

          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (newMap[r][c] === "H") {
                houses.push({ row: r, col: c });
                newMap[r][c] = "G";
              }
              if (newMap[r][c] === "P") {
                setPlayerPos({ row: r, col: c });
                newMap[r][c] = "G";
              }
            }
          }

          setHousePositions(houses);
          setMap(newMap);
          setGridDims({ rows, cols });
        } else {
          console.error("Invalid map data");
        }
      } catch (err) {
        console.error("Fetch room error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMap();
  }, []);

  useEffect(() => {
    if (gridDims.rows === 0 || gridDims.cols === 0) return;

    const updateTileSize = () => {
      const newTileSize = Math.min(
        window.innerWidth / gridDims.cols,
        window.innerHeight / gridDims.rows
      );
      setTileSize(newTileSize);
    };

    updateTileSize();
    window.addEventListener("resize", updateTileSize);
    return () => window.removeEventListener("resize", updateTileSize);
  }, [gridDims]);

  const getPlayerImage = () => {
    if (!map) return player;
    const currentTile = map[playerPos.row][playerPos.col];
    return currentTile === "R" ? player_path : player;
  };

  const movePlayer = (dr, dc) => {
    const newR = playerPos.row + dr;
    const newC = playerPos.col + dc;

    if (
      newR < 0 ||
      newR >= gridDims.rows ||
      newC < 0 ||
      newC >= gridDims.cols ||
      !WALKABLE_TILES.has(map[newR][newC])
    ) {
      setIsColliding(true);
      setTimeout(() => setIsColliding(false), 300);
      return;
    }

    const isInHouse = housePositions.some(
      (house) =>
        newR >= house.row &&
        newR < house.row + HOUSE_SIZE &&
        newC >= house.col &&
        newC < house.col + HOUSE_SIZE
    );

    if (isInHouse) {
      setIsColliding(true);
      setTimeout(() => setIsColliding(false), 300);
      return;
    }

    setPlayerPos({ row: newR, col: newC });
    const username = localStorage.getItem("username");
    if (socket.current?.readyState === WebSocket.OPEN && username) {
      socket.current.send(
        JSON.stringify({
          type: "position",
          username,
          row: newR,
          col: newC,
        })
      );
    }
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 200);
  };

  const openChat = () => {
    if (adjacentTo) {
      setIsChatOpen(true);
      setChatRecipient(adjacentTo);
    }
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setChatRecipient("");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          movePlayer(-1, 0);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          movePlayer(1, 0);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          movePlayer(0, -1);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          movePlayer(0, 1);
          break;
        case "c":
        case "C":
          if (adjacentTo && !isChatOpen) {
            openChat();
          }
          break;
        case "Escape":
          if (isChatOpen) {
            closeChat();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPos, map, adjacentTo, isChatOpen]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading map...</div>
      </div>
    );
  }

  if (!map) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Failed to load map</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-black flex items-center justify-center">
      <div
        className="relative"
        style={{ width: gridDims.cols * tileSize, height: gridDims.rows * tileSize }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridDims.cols}, ${tileSize}px)`,
            gridTemplateRows: `repeat(${gridDims.rows}, ${tileSize}px)`,
          }}
        >
          {map.flatMap((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: `${tileSize}px`,
                  height: `${tileSize}px`,
                  backgroundImage: `url(${TILE_MAP[tile]})`,
                  backgroundSize: "cover",
                }}
              ></div>
            ))
          )}
        </div>

        {housePositions.map((house, index) => (
          <div
            key={`house-${index}`}
            style={{
              position: "absolute",
              top: house.row * tileSize,
              left: house.col * tileSize,
              width: HOUSE_SIZE * tileSize,
              height: HOUSE_SIZE * tileSize,
              backgroundImage: `url(${houseImage})`,
              backgroundSize: "cover",
              zIndex: 5,
            }}
          />
        ))}

        {Object.entries(otherPlayers).map(([username, pos]) => {
          const tile = map?.[pos.row]?.[pos.col];
          const image = tile === "R" ? player_path : player;

          return (
            <div
              key={username}
              style={{
                position: "absolute",
                top: pos.row * tileSize,
                left: pos.col * tileSize,
                width: tileSize,
                height: tileSize,
                zIndex: 8,
              }}
            >
              <div className="text-white text-xs text-center" style={{ marginBottom: "2px" }}>
                {username}
              </div>
              <img src={image} alt={username} style={{ width: tileSize, height: tileSize }} />
            </div>
          );
        })}
        

        {tileSize > 0 && (
          <div
            style={{
              position: "absolute",
              top: playerPos.row * tileSize,
              left: playerPos.col * tileSize,
              width: tileSize,
              height: tileSize,
              zIndex: 10,
            }}
          >
            {/* Player username */}
            <div
              style={{
                position: "absolute",
                bottom: tileSize,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "2px 6px",
                backgroundColor: "white",
                border: "1px solid black",
                borderRadius: "4px",
                zIndex: 11,
                whiteSpace: "nowrap",
                fontSize: "10px",
                fontFamily: "monospace",
                textAlign: "center",
              }}
            >
              {localStorage.getItem("username")}
            </div>

            {/* Chat prompt */}
            {adjacentTo && !isChatOpen && (
              <div
                style={{
                  position: "absolute",
                  bottom: tileSize * 1.5,
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "2px 6px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid yellow",
                  borderRadius: "4px",
                  zIndex: 12,
                  whiteSpace: "nowrap",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textAlign: "center",
                  color: "white",
                }}
              >
                Press C to chat with {adjacentTo}
              </div>
            )}

            {/* Player image */}
            <img
              src={getPlayerImage()}
              alt="Player"
              style={{
                width: tileSize,
                height: tileSize,
                transition: "top 0.2s ease, left 0.2s ease, transform 0.2s ease",
                transform: isJumping
                  ? "translateY(-10%)"
                  : isColliding
                  ? "translateX(-5%)"
                  : "translate(0, 0)",
              }}
            />
          </div>
        )}

        {isChatOpen && (
          <RetroChat 
            onClose={closeChat} 
            recipient={chatRecipient}
            socket={socket.current}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;