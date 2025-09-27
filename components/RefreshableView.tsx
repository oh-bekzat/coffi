import React, { ReactNode, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

interface RefreshableViewProps extends ScrollViewProps {
  children: ReactNode;
  queryKeys?: string[][];
  onRefresh?: () => Promise<void>;
}

/**
 * A reusable component for pull-to-refresh functionality
 * 
 * @param children - The content to display in the scrollable view
 * @param queryKeys - Optional array of query keys to invalidate when refreshing
 * @param onRefresh - Optional custom refresh function
 * @param ...rest - Any additional ScrollView props
 */
const RefreshableView: React.FC<RefreshableViewProps> = ({
  children,
  queryKeys = [],
  onRefresh,
  ...rest
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // If custom refresh function is provided, call it
      if (onRefresh) {
        await onRefresh();
      }
      
      // Invalidate specified query keys
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, queryKeys, queryClient]);

  return (
    <ScrollView
      {...rest}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#fff" // White refresh indicator
          colors={["#fff"]} // For Android
          progressBackgroundColor="#1D1D1D" // Dark background for refresh indicator
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableView; 