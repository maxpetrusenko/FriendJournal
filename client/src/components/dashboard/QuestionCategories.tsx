import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { BookOpen, Map, Sparkles, Target, Heart, Briefcase, Calendar } from "lucide-react";

interface QuestionCategory {
  id: number;
  name: string;
  description: string;
  iconName: string;
  colorClass: string;
}

export default function QuestionCategories() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['/api/question-categories'],
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'book-open':
        return <BookOpen className="w-5 h-5" />;
      case 'map':
        return <Map className="w-5 h-5" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'target':
        return <Target className="w-5 h-5" />;
      case 'heart':
        return <Heart className="w-5 h-5" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'calendar':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Question Categories</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <CardContent className="p-0">
                <div className="animate-pulse">
                  <div className="h-10 w-10 bg-gray-200 rounded-full mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !categories || categories.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Question Categories</h2>
        <Card className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <CardContent className="p-0 text-center">
            <p className="text-gray-500">No categories available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Explore Question Categories</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.slice(0, 4).map((category: QuestionCategory) => (
          <Link href={`/questions?category=${category.id}`} key={category.id}>
            <Card className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-primary-300 transition-colors cursor-pointer">
              <CardContent className="p-0">
                <div className={`h-10 w-10 rounded-full ${category.colorClass} flex items-center justify-center text-${category.colorClass.split('-')[0].replace('bg', '')}-600 mb-3`}>
                  {getIcon(category.iconName)}
                </div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
