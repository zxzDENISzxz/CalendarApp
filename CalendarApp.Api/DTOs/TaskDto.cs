namespace CalendarApp.Api.DTOs;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
    public bool IsExternal { get; set; }
    public int? GroupId { get; set; }
    
    // Вместо набора объектов User отдаем только список их ID
    public List<int> UserIds { get; set; } = new();
}