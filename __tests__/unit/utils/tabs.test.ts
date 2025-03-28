import { newTab, chatTab, graphTab } from '../../../app/_utils/tabs';

describe('tabs utility constants', () => {
  it('should define newTab correctly', () => {
    expect(newTab).toEqual({ name: 'New Tab', path: '/' });
  });

  it('should define chatTab correctly', () => {
    expect(chatTab).toEqual({ name: 'Chat', path: '/chat' });
  });

  it('should define graphTab correctly', () => {
    expect(graphTab).toEqual({ name: 'Graph', path: '/graph' });
  });

  it('should have the correct structure for all tab constants', () => {
    const tabs = [newTab, chatTab, graphTab];
    
    tabs.forEach(tab => {
      expect(tab).toHaveProperty('name');
      expect(tab).toHaveProperty('path');
      expect(typeof tab.name).toBe('string');
      expect(typeof tab.path).toBe('string');
    });
  });

  it('should have unique paths for all tabs', () => {
    const tabPaths = [newTab.path, chatTab.path, graphTab.path];
    const uniquePaths = [...new Set(tabPaths)];
    
    expect(uniquePaths.length).toBe(tabPaths.length);
  });

  it('should have unique names for all tabs', () => {
    const tabNames = [newTab.name, chatTab.name, graphTab.name];
    const uniqueNames = [...new Set(tabNames)];
    
    expect(uniqueNames.length).toBe(tabNames.length);
  });
});