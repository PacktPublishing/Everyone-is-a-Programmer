import { useState, useEffect } from "react";

export function useContent(category: string = "general") {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content?category=${category}`);
        const result = await response.json();

        if (result.success) {
          setContent(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [category]);

  return { content, loading };
}
