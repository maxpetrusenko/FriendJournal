import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  fullName: string;
  avatarColor: string;
}

interface UserAvatarProps {
  user: User;
  size?: "small" | "medium" | "large";
}

export default function UserAvatar({ user, size = "medium" }: UserAvatarProps) {
  const sizeMap = {
    small: "w-10 h-10",
    medium: "w-12 h-12",
    large: "w-16 h-16"
  };

  const initialsMap = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base"
  };

  return (
    <Avatar className={`${sizeMap[size]} ${user.avatarColor} flex-shrink-0`}>
      <AvatarFallback className={`${initialsMap[size]} text-white font-medium`}>
        {user.fullName.charAt(0)}
      </AvatarFallback>
    </Avatar>
  );
}
