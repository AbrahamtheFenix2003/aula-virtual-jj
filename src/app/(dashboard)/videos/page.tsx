// 1. React/Next.js
import Link from "next/link";

// 2. Third-party
import { Video, Play, Clock, Filter } from "lucide-react";

// 3. Internal (@/ alias)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BELT_NAMES, BELT_COLORS, VIDEO_CATEGORY_NAMES, canAccessBeltContent } from "@/types";

export default async function VideosPage() {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  const userBelt = session.user.belt;

  // Obtener videos publicados que el usuario puede ver según su nivel
  const videos = await prisma.video.findMany({
    where: {
      isPublished: true,
      academyId: session.user.academyId,
    },
    include: {
      progress: {
        where: { userId: session.user.id },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filtrar videos según nivel del usuario
  const accessibleVideos = videos.filter((video) =>
    canAccessBeltContent(userBelt, video.minBelt, video.maxBelt)
  );

  // Estadísticas
  const completedCount = accessibleVideos.filter(
    (v) => v.progress[0]?.completed
  ).length;
  const inProgressCount = accessibleVideos.filter(
    (v) => v.progress[0]?.percentage > 0 && !v.progress[0]?.completed
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Videos</h1>
          <p className="text-muted-foreground">
            Biblioteca de técnicas para nivel {BELT_NAMES[userBelt]} y anteriores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accessibleVideos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{inProgressCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Video Grid */}
      {accessibleVideos.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No hay videos disponibles</h3>
          <p className="text-muted-foreground">
            Los instructores aún no han subido videos para tu nivel.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {accessibleVideos.map((video) => {
            const progress = video.progress[0];
            const isCompleted = progress?.completed;
            const percentage = progress?.percentage || 0;

            return (
              <Link key={video.id} href={`/videos/${video.id}`}>
                <Card className="group overflow-hidden hover:border-primary transition-colors cursor-pointer">
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                    {/* Progress bar */}
                    {percentage > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div
                          className={`h-full ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                    {/* Duration */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
                    </div>
                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-green-500 text-white">
                          Completado
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {VIDEO_CATEGORY_NAMES[video.category] || video.category}
                      </Badge>
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: BELT_COLORS[video.minBelt] }}
                        title={`Nivel: ${BELT_NAMES[video.minBelt]}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
