export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface TopicList {
  topics: Topic[];
  generatedAt: Date;
}
