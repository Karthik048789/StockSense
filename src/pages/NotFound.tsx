import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Layers } from "lucide-react";
import { Button } from "../components/ui/button";

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center mb-4">
        <Layers className="h-8 w-8" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
        The inventory module or resource you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="bg-blue-600 hover:bg-blue-700">
        <Link to="/" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Return to Inventory Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
