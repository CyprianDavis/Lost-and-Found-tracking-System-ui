import React, { useMemo, useState } from "react";
import "./Dashboard.css";
import { useApiList } from "../../hooks/useApiList";
import AdminDashboard from "./AdminDashboard";

const FALLBACK_IMAGE =
  "https://placehold.co/600x400/e4e7eb/2c3e50?text=Lost+Item";

// Helper function to convert byte array to data URL
const convertBytesToDataURL = (byteArray) => {
  // Handle null/undefined
  if (!byteArray) {
    return "";
  }

  // If it's already a string
  if (typeof byteArray === "string") {
    if (byteArray.startsWith("data:")) {
      return byteArray;
    }
    if (byteArray.length > 0) {
      return `data:image/png;base64,${byteArray}`;
    }
    return "";
  }

  // If it's a JSON array (byte array from backend)
  if (Array.isArray(byteArray)) {
    if (byteArray.length === 0) {
      return "";
    }

    try {
      // Convert JSON array to Uint8Array
      const uint8Array = new Uint8Array(byteArray);

      // Convert to binary string
      let binary = "";
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }

      // Convert to base64
      const base64 = btoa(binary);
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error("Error converting byte array:", error);
      return "";
    }
  }

  return "";
};

const getImageUrl = (item) => {
  if (!item) return FALLBACK_IMAGE;

  // Handle base64 string or byte array from backend
  if (item.imageData) {
    const dataUrl = convertBytesToDataURL(item.imageData);
    if (dataUrl) return dataUrl;
  }

  // Fallback to other image sources
  return (
    item.imageUrl ||
    item.photoUrl ||
    item.attachments?.[0]?.fileUrl ||
    FALLBACK_IMAGE
  );
};

export default function Dashboard({ role }) {
  const normalizedRole = role?.toUpperCase?.() || "";
  const isCommunityUser =
    normalizedRole === "STUDENT" || normalizedRole === "STAFF";
  if (isCommunityUser) {
    return <CommunityDashboard />;
  }
  return <AdminDashboard />;
}

function CommunityDashboard() {
  const {
    data: items = [],
    loading: itemsLoading,
    error: itemsError,
    refetch: refetchItems,
  } = useApiList("/api/v1/items", { size: 100 });
  const {
    data: lostReports = [],
    loading: lostLoading,
    error: lostError,
    refetch: refetchLost,
    setParams: setLostParams,
  } = useApiList("/api/v1/lost-reports", { size: 100, status: "PENDING" });
  const {
    data: foundReports = [],
    loading: foundLoading,
    error: foundError,
    refetch: refetchFound,
    setParams: setFoundParams,
  } = useApiList("/api/v1/found-reports", { size: 100 });

  const loading = itemsLoading || lostLoading || foundLoading;
  const error = itemsError || lostError || foundError;

  const [search, setSearch] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  const handleRefresh = () => {
    refetchItems();
    refetchLost();
    refetchFound();
  };

  const itemMap = useMemo(() => {
    const map = new Map();
    items.forEach((item) => map.set(item.id, item));
    return map;
  }, [items]);

  // Debug: Log items to see image data format
  React.useEffect(() => {
    if (items.length > 0) {
      console.log("Dashboard items data:", items);
      const itemWithImage = items.find((item) => item.imageData);
      if (itemWithImage) {
        console.log("Item with image data:", {
          id: itemWithImage.id,
          name: itemWithImage.name,
          imageDataType: typeof itemWithImage.imageData,
          isArray: Array.isArray(itemWithImage.imageData),
          length: Array.isArray(itemWithImage.imageData)
            ? itemWithImage.imageData.length
            : "N/A",
          preview: Array.isArray(itemWithImage.imageData)
            ? itemWithImage.imageData.slice(0, 10)
            : itemWithImage.imageData?.substring(0, 50),
        });
      }
    }
  }, [items]);

  React.useEffect(() => {
    const keyword = search.trim();
    setLostParams((prev) => ({ ...prev, keyword: keyword || undefined }));
    setFoundParams((prev) => ({ ...prev, keyword: keyword || undefined }));
  }, [search, setLostParams, setFoundParams]);

  const foundItemIds = useMemo(
    () => new Set(foundReports.map((report) => report.itemId)),
    [foundReports],
  );

  const pendingLostReports = useMemo(
    () =>
      lostReports.filter(
        (report) =>
          report.status === "PENDING" && !foundItemIds.has(report.itemId),
      ),
    [lostReports, foundItemIds],
  );

  const cards = useMemo(() => {
    const buildCard = (report, type) => {
      const item = itemMap.get(report.itemId);
      const baseTitle =
        item?.name ||
        `${type === "found" ? "Found" : "Lost"} Item #${report.id}`;
      const description =
        report.extraDescription ||
        item?.description ||
        `No description provided for this ${type} report.`;
      const tags = [
        type === "found"
          ? report.locationFound && `Found at ${report.locationFound}`
          : report.locationLost && `Lost at ${report.locationLost}`,
        item?.brand && `Brand: ${item.brand}`,
        item?.color && `Color: ${item.color}`,
        type === "found" && report.storageLocation
          ? `Stored: ${report.storageLocation}`
          : null,
      ].filter(Boolean);

      return {
        id: `${type}-${report.id}`,
        type,
        title: baseTitle,
        description,
        image: getImageUrl(item),
        tags,
        meta: {
          date: type === "found" ? report.dateFound : report.dateLost,
          reference: report.referenceCode,
          location:
            type === "found" ? report.locationFound : report.locationLost,
          status: report.status,
          storageLocation: report.storageLocation,
        },
        report,
        item,
      };
    };

    return {
      found: foundReports.map((report) => buildCard(report, "found")),
      lost: pendingLostReports.map((report) => buildCard(report, "lost")),
    };
  }, [foundReports, pendingLostReports, itemMap]);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filterFn = (card) => {
      if (!term) return true;
      return [card.title, card.description, card.meta.location]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    };
    return {
      found: cards.found.filter(filterFn),
      lost: cards.lost.filter(filterFn),
    };
  }, [cards, search]);

  const totalResults = filteredCards.found.length + filteredCards.lost.length;

  const renderCards = (list, emptyMessage) => {
    if (loading) {
      return (
        <div className="item-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="item-card skeleton">
              <div className="item-image-wrapper skeleton-block" />
              <div className="item-card-body">
                <div className="skeleton-title" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return <div className="dashboard-alert">{emptyMessage}</div>;
    }
    return (
      <div className="item-grid">
        {list.map((card) => (
          <div className="item-card" key={card.id}>
            <div className="item-image-wrapper">
              <img
                src={card.image}
                alt={card.title}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <span className="item-category">
                {card.type === "found" ? "Found" : "Lost"}
              </span>
            </div>
            <div className="item-card-body">
              <div className="item-card-header">
                <h3>{card.title}</h3>
                <span className="status-pill">
                  {card.meta.status ||
                    (card.type === "found" ? "AVAILABLE" : "PENDING")}
                </span>
              </div>
              <p className="item-description">{card.description}</p>
              {card.tags.length > 0 && (
                <div className="item-tags">
                  {card.tags.map((tag) => (
                    <span key={tag} className="item-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="item-meta">
                {card.meta.location && <span>{card.meta.location}</span>}
                {card.meta.date && <span>{card.meta.date}</span>}
              </div>
            </div>
            <div className="item-card-actions">
              <button
                type="button"
                className="view-details-btn"
                onClick={() => setSelectedCard(card)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Lost &amp; Found Reports</h1>
          <p>
            Browse the university lost-and-found activity feed. Use the Lost
            Reports and Found Reports pages when you need to submit a new entry.
          </p>
        </div>
        <div className="dashboard-actions">
          <input
            className="dashboard-search"
            type="search"
            placeholder="Search by name, category, or color..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button className="refresh-btn" type="button" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert error">
          {error.message || "Unable to load dashboard data."}
        </div>
      )}

      {!loading && !error && totalResults === 0 && (
        <div className="dashboard-alert">
          No reports match that search. Try another keyword or refresh the list.
        </div>
      )}

      <section className="grid-section">
        <div className="section-header">
          <div>
            <h2>Found Items</h2>
            <p>Items that have been recovered and await claims.</p>
          </div>
          <span className="section-count">
            {filteredCards.found.length} item
            {filteredCards.found.length === 1 ? "" : "s"}
          </span>
        </div>
        {renderCards(filteredCards.found, "No found reports at the moment.")}
      </section>

      <section className="grid-section">
        <div className="section-header">
          <div>
            <h2>Lost Items</h2>
            <p>Recently reported losses from the community.</p>
          </div>
          <span className="section-count">
            {filteredCards.lost.length} item
            {filteredCards.lost.length === 1 ? "" : "s"}
          </span>
        </div>
        {renderCards(filteredCards.lost, "No lost reports at the moment.")}
      </section>

      {selectedCard && (
        <div className="item-modal" role="dialog" aria-modal="true">
          <div className="item-modal-content">
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelectedCard(null)}
              aria-label="Close details"
            >
              &times;
            </button>
            <div className="modal-body">
              <div className="modal-image">
                <img
                  src={selectedCard.image}
                  alt={selectedCard.title}
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
              </div>
              <div className="modal-details">
                <h2>{selectedCard.title}</h2>
                <p>{selectedCard.description}</p>
                <div className="modal-info-list">
                  <div>
                    <strong>Report Type:</strong>{" "}
                    {selectedCard.type === "found" ? "Found" : "Lost"}
                  </div>
                  {selectedCard.meta.status && (
                    <div>
                      <strong>Status:</strong> {selectedCard.meta.status}
                    </div>
                  )}
                  {selectedCard.meta.reference && (
                    <div>
                      <strong>Reference:</strong> {selectedCard.meta.reference}
                    </div>
                  )}
                  {selectedCard.meta.location && (
                    <div>
                      <strong>Location:</strong> {selectedCard.meta.location}
                    </div>
                  )}
                  {selectedCard.meta.date && (
                    <div>
                      <strong>Date:</strong> {selectedCard.meta.date}
                    </div>
                  )}
                  {selectedCard.meta.storageLocation && (
                    <div>
                      <strong>Storage:</strong>{" "}
                      {selectedCard.meta.storageLocation}
                    </div>
                  )}
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="view-details-btn"
                    onClick={() => setSelectedCard(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
