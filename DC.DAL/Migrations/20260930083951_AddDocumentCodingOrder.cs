using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DC.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentCodingOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DocumentCodingOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Part = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    DisplayLabel = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DocumentCodingOrders", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCodingOrders_Part",
                table: "DocumentCodingOrders",
                column: "Part",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentCodingOrders_SortOrder",
                table: "DocumentCodingOrders",
                column: "SortOrder",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DocumentCodingOrders");
        }
    }
}
