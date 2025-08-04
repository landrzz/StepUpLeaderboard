import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Users, Trophy } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick?: () => void;
  isGroupAdmin?: boolean;
}

export default function EmptyState({ onUploadClick, isGroupAdmin = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Icon Stack */}
          <div className="relative mb-8">
            <div className="flex justify-center items-center space-x-4">
              <div className="p-4 bg-step-teal/10 rounded-full">
                <FileSpreadsheet className="h-12 w-12 text-step-teal" />
              </div>
              <div className="p-3 bg-step-green/10 rounded-full">
                <Users className="h-10 w-10 text-step-green" />
              </div>
              <div className="p-3 bg-step-orange/10 rounded-full">
                <Trophy className="h-10 w-10 text-step-orange" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isGroupAdmin ? 'Welcome to StepUp Leaderboard!' : 'No Data Available'}
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-lg mx-auto">
            {isGroupAdmin 
              ? 'Get started by uploading your first CSV file with participant step data to create your leaderboard.'
              : 'The group administrator needs to upload step data to view the leaderboard.'}
          </p>

          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-step-teal/10 rounded-lg flex-shrink-0">
                <Upload className="h-5 w-5 text-step-teal" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Upload CSV Data</h3>
                <p className="text-sm text-gray-600">
                  Import participant step counts and fitness data
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-step-green/10 rounded-lg flex-shrink-0">
                <Users className="h-5 w-5 text-step-green" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Track Progress</h3>
                <p className="text-sm text-gray-600">
                  Monitor weekly challenges and participant performance
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-step-orange/10 rounded-lg flex-shrink-0">
                <Trophy className="h-5 w-5 text-step-orange" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">View Rankings</h3>
                <p className="text-sm text-gray-600">
                  See leaderboards and celebrate achievements
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            {isGroupAdmin && (
              <Button 
                onClick={onUploadClick}
                size="lg" 
                className="bg-step-teal hover:bg-step-teal/90 text-white px-8 py-3"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Your First CSV File
              </Button>
            )}
            
            {isGroupAdmin && (
              <p className="text-sm text-gray-500">
                Need help? Check our{' '}
                <a href="#" className="text-step-teal hover:underline">
                  CSV format guide
                </a>{' '}
                for the expected data structure.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
